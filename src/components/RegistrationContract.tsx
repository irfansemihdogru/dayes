
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';
import { cancelSpeech } from '@/utils/speechUtils';

interface RegistrationContractProps {
  onComplete: () => void;
}

const contractText = `ÖĞRENCİ-VELİ-OKUL SÖZLEŞMESİ 
Okul - veli iş birliği, öğrenci başarısını artıran önemli etmenlerden biridir. 
Güvenli ve düzenli bir okul ortamının sağlanmasında velilerin rolü büyüktür. 
Veli katılımının öncelikli amacı, okulun eğitim etkinliklerini yönlendiren okul 
personeline destek olmak, çalışmalara meslekleri ve yeterlilikleri doğrultusunda 
farklı düzeylerde katkı sağlamak, okul ve ev arasında sıkı bağlar kurarak 
öğrencinin eğitim sürecinde huzurlu ve mutlu olmasına yardımcı olmaktır. 
Sözleşmenin Tarafları: 
· Öğrenci 
· Öğrenci Velisi / Anne -Babası veya yasal vasisi 
· Okul Yönetimi 
OKULUN HAK VE SORUMLULUKLARI
Haklar
· Destekleyici, güvenli ve etkili bir ortamda çalışmak 
· Okul toplumundan ve çevreden saygı ve destek görmek 
· Okulda alınan tüm kararlara ve okul kurallarına uyulmasını istemek 
Okula Özgü Haklar 
· Gerek görüldüğü takdirde planlanmış eğitim etkinliklerinin yer, zaman ve 
içeriğini en az bir hafta önceden haber vererek değiştirmek. 
· Ödül ve cezalara karar vermek; öğrenci ve velilerin bu kararları saygıyla 
karşılamasını ve önerilere uyulmasını beklemek 
· Okulun hedeflerine uygun planlamalara öğrenci ve velilerin katılımını ve 
destegini beklemek 
SORUMLULUKLAR
· Öğrencilerin akademik ve sosyal gelişimlerini destekleyecek materyal, ekipman 
ve teknolojik donanım sağlamak. 
· Okulda olumlu bir kültür yaratmak. 
· Öğrenci, veli ve çalışanlar arasında hiçbir nedenden dolayı ayrım yapmamak. 
· Eğitim ve öğretim sürecini okulun duvarlarıyla sınırlamamak. 
· Öğrencilerin, velilerin okul çalışanlarının kendilerini ve fikirlerini ifade 
edebilecekleri fırsatlar yaratmak. 
· Okulun güvenilir ve temiz olmasını sağlamak. 
· Öğrenciler için iyi bir model olmak. 
· Okulun ve öğrencinin ihtiyaçları doğrultusunda sürekli gelişmek. 
· Okulda etkili öğrenmeyi destekleyecek bir ortam yaratmak. 
Okulun işleyişine ait kararların ve kuralların uygulanmasını takip etmek. 
· Okul - toplum ilişkisini geliştirmek. 
· Öğretmen, öğrenci ve veli görüşmelerini düzenlemek ve ilgilileri 
zamanındabilgilendirmek. 
· Okul çalışanlarının ihtiyaçları doğrultusunda okuliçi eğitim çalışmaları 
düzenlemek. 
· Okul çalışanlarının ihtiyaçlarını belirleyerek giderilmesi için çözümler üretmek. 
· Okulun işleyişi ve yönetimi konusunda ilgili tarafları düzenli aralıklarla 
bilgilendirmek. 
· Veli ve öğrenci hakkında ihtiyaç duyulan bilgileri toplamak, değerlendirmek, 
sonuçlarını ilgililerle paylaşmak ve gizliliğini sağlamak. 
· Veli ve öğretmenler arasında düzenli bir iletişimi sağlamak. 
· Okul ve çevresinde şiddet içeren davranışlara kesinlikle izin vermemek. 
Okula Özgü Sorumluluklar
· Bilimsel süreli yayınları okul kütüphanesinde kullanıma sunmak. 
· Öğrenciler için toplumsal hizmet etkinlikleri planlamak ve yürütmek
ÖĞRENCİNİN HAK VE SORUMLULUKLARI
Haklar
· Düşüncelerini özgürce ifade etme 
· Güvenli ve sağlıklı bir okul ve sınıf ortamında bulunma 
· Bireysel farklılıklarına saygı gösterilmesi 
· Kendisine ait değerlendirme sonuçlarını zamanında öğrenme ve sonuçlar 
üzerindeki fikirlerini ilgililerle tartışabilme 
· Kendisine ait özel bilgilerin gizliliğinin sağlanması 
· Okulun işleyişi, kuralları, alınan kararlar hakkında bilgilendirilme 
· Okul kurallarının uygulanmasında tüm öğrencilere eşit davranılması 
· Kendini ve diğer öğrencileri tanıma, kariyer planlama, karar verme ve ihtiyaç 
duyduğu benzer konularda danışmanlık alma 
· Akademik ve kişisel gelişimini destekleyecek ders dışı etkinliklere katılma 
· Okul yönetiminde temsil etme ve edilme 
Okula Özgü Haklar
· Özgün eserlerini kamuya sergileme 
· Ulusal ve uluslar arası etkinliklerde okulu temsil etmede gerekli durumlarda 
okuldan maddi ve manevi destek alabilme 
· Ders dışı etkinliklerle ilgili sorumluluklar dâhilinde okulun her türlü 
olanağından yararlanma 
SORUMLULUKLAR 
· Okulda bulunan kişilerin haklarına ve kişisel farklılıklarına saygı göstereceğim. 
· Ders dışı etkinliklere katılıp bu etkinliklerden en iyi şekilde yararlanacağım. 
· Arkadaşlarımın ve okulun eşyalarına zarar vermeyeceğim; zarar verdiğim 
takdirde bu zararın bedelini karşılayacağım. 
· Sınıfça belirlediğimiz kurallara uyacağım. 
· Ödül ve disiplin yönetmeliğine ve veli-öğrenci el kitapçığında yer alan tüm okul 
kurallarına uyacağım. 
· Okul yönetimine (fikir, eleştiri, öneri ve çalışmalarımla) katkıda bulunacağım. 
· Arkadaşlarıma, öğretmenlerime ve tüm okul çalışanlarına saygılı davranacağım. 
· Hiçbir şekilde kaba kuvvete ve baskıya başvurmayacağım. 
Okula Özgü Sorumluluklar
· Okulun bilim ve sanat panolarına yazı ve fotoğraflarla katkıda bulunacağım. 
· Okulda düzenlenecek eğitim semineri ve toplantılarda gelen konuklara ilgili 
birimlere ulaşmaları için rehberlik edeceğim. 
· Okulun eğitim felsefesine uygun, çalışkan ve gayretli olacağım 
· Okulumun adını her zaman üst düzeyde tutacak davranış ve gayret içinde 
olacağım 
VELİNİN HAK VE SORUMLULUKLARI
Haklar
· Çocuğumun eğitimiyle ilgili tüm konularda bilgilendirilmek. 
· Adil ve saygılı davranışlarla karşılanmak. 
· Çocuğuma okul ortamında nitelikli kaynaklar, eğitim ve fırsatlar sunulacağını 
bilmek. 
· Düzenli aralıklarla okulun işleyişi hakkında bilgilendirilmek. 
· Okul Aile Birliği aracılığı ile okul yönetimine yardımcı olmak ve böylelikle 
katkıda bulunmak. 
· Çocuğumun okuldaki gelişim süreciyle ilgili olarak düzenli aralıklarla 
bilgilendirilmek. 
 Okula Özgü Haklar 
· Okulun veli eğitim çalışmalarından yararlanmak. 
· Okulun sunduğu tüm sosyal ve kültürel etkinliklerden yararlanmak 
SORUMLULUKLAR
· Çocuğumun her gün okula zamanında, öğrenmeye hazır, okulun kılık-kıyafet 
kurallarına uygun bir şekilde gitmesine yardımcı olacağım. 
· Okulun duyuru ve yayınlarını takip edeceğim. 
· Bilgi edinmek ve toplamak amacıyla gönderilen her tür anket ve formu 
doldurup zamanında geri göndereceğim. 
· Okul Gelişim Yönetim Ekibi ve Okul-Aile Birliği seçimlerine ve toplantılarına 
katılacağım. 
· İhtiyaç duyduğunda öğrencimin ödevlerini yapabilmesi konusunda olanak 
sağlayacağım, gerekli açıklamaları yapacağım, ancak; kendi yapması gereken 
ödevleri asla yapmayacağım. 
· Çocuğumun sağlıklı bir şekilde çalışabilmesine uygun fiziki ortamı 
sağlayacağım. 
· Çocuğumun uyku ve dinlenme saatlerine dikkat edeceğim. 
· Okulun düzenleyeceği veli eğitim seminerlerine katılacağım 
· Çocuğuma yaşına uygun sorumluluklar vereceğim. 
· Disiplin yönetmeliğini ve veli-öğrenci el kitapçığını dikkatlice okuyup 
cocuğumun, disiplin kurallarına uyması için gerekli önlemleri alacağım. 
· Çocuğumun ruhsal ve fiziksel durumundaki değişmeler hakkında okulu 
zamanında bilgilendireceğim. 
· Aile ortamında fiziksel ve psikolojik şiddete izin vermeyeceğim. 
Okula Özgü Sorumluluklar
· Okula maddi manevi her türlü katkıda bulunacağım 
· Çocuğumun internette zararlı içeriklerin yer aldığı sitelere erişmesini 
engelleyeceğim 
· .Çocuğumun toplumsal hizmet kurumlarında gönüllü olarak çalışmasını, sosyal 
yardım etkinliklerinde görev almasını destekleyeceğim. 
Sözleşmenin tarafı olarak yukarıda sunulan hak ve sorumluluklarımı okudum. 
Haklarıma sahip çıkacağıma ve sorumluluklarımı yerine getireceğime söz 
veririm.`;

const RegistrationContract: React.FC<RegistrationContractProps> = ({ onComplete }) => {
  const { isDarkMode } = useTheme();
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number>(-1);
  const [isReading, setIsReading] = useState(false);
  const [readingFinished, setReadingFinished] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("");
  const [instructionsShown, setInstructionsShown] = useState(true);
  const contractParagraphs = contractText.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeElementRef = useRef<HTMLParagraphElement | null>(null);
  
  // Ensure any global voice listeners are temporarily disabled during contract reading
  useEffect(() => {
    // Create a custom event to notify other components that contract reading is active
    const notifyReadingStatus = (status: boolean) => {
      const event = new CustomEvent('contractReading', { 
        detail: { isReading: status }
      });
      window.dispatchEvent(event);
    };
    
    if (isReading) {
      notifyReadingStatus(true);
    }
    
    return () => {
      notifyReadingStatus(false);
      cancelSpeech();
    };
  }, [isReading]);
  
  useEffect(() => {
    // First show instructions then start reading the contract after delay
    showInitialInstructions();
    
    return () => {
      cancelSpeech();
    };
  }, []);

  // Effect to handle scrolling to active paragraph
  useEffect(() => {
    if (currentSpeakingIndex >= 0) {
      const paragraphElement = document.getElementById(`paragraph-${currentSpeakingIndex}`);
      if (paragraphElement && scrollRef.current) {
        // Set the current active element reference
        activeElementRef.current = paragraphElement as HTMLParagraphElement;
        
        // Calculate position to make the element visible in the middle of the scroll area
        const scrollContainer = scrollRef.current;
        const scrollContainerHeight = scrollContainer.clientHeight;
        const elemTop = paragraphElement.offsetTop;
        
        // Target position: element at 1/3 of the scroll container
        const targetScrollTop = elemTop - (scrollContainerHeight / 3);
        
        // Smooth scroll to element
        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [currentSpeakingIndex]);

  // Show initial instructions to the user
  const showInitialInstructions = async () => {
    setInstructionsShown(true);
    setIsReading(true);

    // Enhanced initial instructions with more clarity for visually and hearing impaired users
    const initialInstructions = 
      "Sayın veli, 9. sınıf kayıt sözleşmesini dinlemeye başlamak üzeresiniz. " +
      "Bu sözleşme, öğrenci, veli ve okul arasındaki karşılıklı hak ve sorumlulukları belirleyen yasal bir dokümandır. " +
      "Sözleşme okunurken lütfen dikkatle dinleyiniz. " +
      "Aktif olarak okunan paragraf ekranda mavi renk ile vurgulanacaktır. " +
      "Sözleşmenin tamamı okunduktan sonra, sayfanın alt kısmındaki 'Sözleşmeyi Anladım' butonuna tıklayarak kayıt formuna geçebilirsiniz. " + 
      "Lütfen unutmayınız, kayıt formunu doldurduktan sonra çıktısını almalı ve sağ tarafta bulunan başvuru kutusuna bırakmalısınız. " +
      "Şimdi sözleşmeyi okumaya başlıyorum.";
    
    await new Promise<void>((resolve) => {
      speakText(initialInstructions, {
        rate: 0.7, // Slower rate for better comprehension
        pitch: 1.0, // Normal pitch for clarity
        volume: 1.0, // Full volume
        onEnd: () => {
          // Short pause before starting the actual contract
          setTimeout(() => {
            setInstructionsShown(false);
            readContract();
            resolve();
          }, 1000);
        }
      });
    });
  };
  
  const readContract = async () => {
    setIsReading(true);
    
    // Group paragraphs by sections for more organized reading
    const sections = [
      { title: "SÖZLEŞME GİRİŞİ", endIndex: 6, announcement: "Şimdi sözleşmenin giriş bölümünü okuyorum." },
      { title: "SÖZLEŞME TARAFLARI", endIndex: 10, announcement: "Şimdi sözleşmenin taraflarını belirtiyorum." },
      { title: "OKUL HAKLARI", endIndex: 20, announcement: "Şimdi okulun haklarını okuyorum." },
      { title: "OKUL SORUMLULUKLARI", endIndex: 42, announcement: "Şimdi okulun sorumluluklarını okuyorum." },
      { title: "ÖĞRENCİ HAKLARI", endIndex: 62, announcement: "Şimdi öğrencilerin haklarını okuyorum." },
      { title: "ÖĞRENCİ SORUMLULUKLARI", endIndex: 81, announcement: "Şimdi öğrencilerin sorumluluklarını okuyorum." },
      { title: "VELİ HAKLARI", endIndex: 97, announcement: "Şimdi velilerin haklarını okuyorum." },
      { title: "VELİ SORUMLULUKLARI", endIndex: 130, announcement: "Son olarak, velilerin sorumluluklarını okuyorum." }
    ];
    
    // Read contract by sections with appropriate pauses
    let currentParaIndex = 0;
    for (let section of sections) {
      setCurrentSection(section.title);
      
      // Announce the section title first
      await new Promise<void>((resolve) => {
        speakText(section.announcement, {
          rate: 0.7, // Slower rate for better comprehension
          pitch: 1.0,
          volume: 1.0,
          onEnd: () => setTimeout(resolve, 800) // Longer pause after section announcement
        });
      });
      
      while (currentParaIndex <= section.endIndex && currentParaIndex < contractParagraphs.length) {
        if (contractParagraphs[currentParaIndex].trim()) {
          setCurrentSpeakingIndex(currentParaIndex);
          
          await new Promise<void>((resolve) => {
            speakText(contractParagraphs[currentParaIndex], {
              rate: 0.65, // Even slower rate for better comprehension
              pitch: 1.0,
              volume: 1.0,
              onEnd: () => {
                // Slightly longer pause after each paragraph for better comprehension
                setTimeout(resolve, 600);
              }
            });
          });
        }
        currentParaIndex++;
      }
      
      // Longer pause between sections
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show final instructions
    await showFinalInstructions();
    
    setIsReading(false);
    setReadingFinished(true);
  };

  // Show final instructions after contract is read
  const showFinalInstructions = async () => {
    // Reset the current speaking index to avoid highlighting
    setCurrentSpeakingIndex(-1);
    setCurrentSection("SONUÇ");
    
    const finalInstructions = 
      "Sayın veli, sözleşmenin okunması tamamlanmıştır. " +
      "Bu sözleşmeyi dikkatlice dinlediğiniz için teşekkür ederiz. " + 
      "Şimdi, lütfen okunan sözleşmeyi anladığınızı ve kabul ettiğinizi belirtmek için " + 
      "sayfanın alt kısmındaki 'Sözleşmeyi Anladım' butonuna tıklayınız. " +
      "Bu işlemi yaptıktan sonra, 9. sınıf kayıt formunu eksiksiz ve doğru bir şekilde doldurmanız gerekmektedir. " +
      "Formda öğrenci ve veli bilgilerini eksiksiz doldurup, seçilen alanı belirttikten sonra, " +
      "formu görevli personele teslim ediniz veya sağ tarafta bulunan başvuru kutusuna bırakınız. " +
      "Size verilen kağıt ve kalemi kullanarak formu doldurabilirsiniz. " +
      "Herhangi bir sorunuz varsa okul yönetimine başvurabilirsiniz. " +
      "Okul yönetimi adına iyi günler dileriz.";
    
    await new Promise<void>((resolve) => {
      speakText(finalInstructions, {
        rate: 0.7, // Slower rate for better comprehension
        pitch: 1.0,
        volume: 1.0,
        onEnd: () => resolve()
      });
    });
  };
  
  return (
    <Card className={`w-full mx-auto max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">9. Sınıf Kayıt Sözleşmesi</CardTitle>
        {currentSection && (
          <div className="text-center mt-1 text-white/90 font-medium text-lg">
            {currentSection}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {instructionsShown && (
          <div className={`mb-4 p-4 rounded-md ${isDarkMode ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-50 border border-amber-200'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
              Lütfen Dikkat
            </h3>
            <p className={`${isDarkMode ? 'text-amber-100' : 'text-amber-700'} text-lg leading-relaxed`}>
              Sayın veli, 9. sınıf kayıt sözleşmesini dinlemeye başlamak üzeresiniz. 
              Bu sözleşme, öğrenci, veli ve okul arasındaki karşılıklı hak ve sorumlulukları belirleyen yasal bir dokümandır.
              Lütfen sözleşmeyi dikkatle dinleyiniz. Okunan paragraf ekranda vurgulanacaktır.
            </p>
            <p className={`mt-3 ${isDarkMode ? 'text-amber-100' : 'text-amber-700'} text-lg leading-relaxed`}>
              <strong>Önemli:</strong> Sözleşme tamamlandıktan sonra, kayıt formunu doldurarak sağ taraftaki başvuru kutusuna bırakmanız gerekmektedir.
            </p>
          </div>
        )}
        
        <div 
          ref={scrollRef} 
          className="max-h-[500px] overflow-y-auto p-4 mb-6 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 scroll-smooth"
          aria-live="polite"
        >
          {contractParagraphs.map((paragraph, index) => (
            <p 
              key={index} 
              id={`paragraph-${index}`}
              ref={currentSpeakingIndex === index ? (el) => { activeElementRef.current = el; } : null}
              className={`mb-3 transition-all duration-300 text-lg ${
                currentSpeakingIndex === index
                  ? `${isDarkMode 
                      ? 'bg-blue-900/90 text-white font-medium text-xl px-6 py-4 rounded-lg shadow-lg border-l-8 border-blue-400 -mx-2 my-4' 
                      : 'bg-blue-100 text-blue-900 font-medium text-xl px-6 py-4 rounded-lg shadow-md border-l-8 border-blue-500 -mx-2 my-4'
                    }`
                  : ''
              }`}
              aria-current={currentSpeakingIndex === index ? "true" : "false"}
            >
              {paragraph || '\u00A0'}
            </p>
          ))}
        </div>
        
        <div className="text-center">
          {readingFinished ? (
            <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-green-900/30 border border-green-700/50' : 'bg-green-50 border border-green-200'}`}>
              <p className={`${isDarkMode ? 'text-green-300' : 'text-green-700'} font-semibold text-lg`}>
                Sözleşme okunması tamamlanmıştır. Kayıt formuna geçmek için aşağıdaki butona tıklayınız.
              </p>
              <p className={`mt-3 ${isDarkMode ? 'text-green-200' : 'text-green-600'} text-lg font-medium`}>
                <strong>Önemli Hatırlatma:</strong> Kayıt formunu eksiksiz doldurduktan sonra, çıktısını alıp imzalayarak 
                sağ tarafta bulunan başvuru kutusuna bırakmanız gerekmektedir. Size verilen kağıt ve kalemi kullanarak 
                formu doldurabilirsiniz.
              </p>
            </div>
          ) : (
            <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'} font-bold mb-4 text-lg`}>
              {isReading ? "Sözleşme okunuyor, lütfen bekleyiniz..." : "Sözleşmeyi anladıktan sonra aşağıdaki butonla devam ediniz."}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-6 text-xl`}
          onClick={onComplete}
          disabled={isReading && !readingFinished}
          aria-label="Sözleşmeyi anladım, kayıt formuna geç"
        >
          {isReading && !readingFinished ? "Sözleşme Okunuyor..." : "Sözleşmeyi Anladım"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RegistrationContract;
