
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
  const contractParagraphs = contractText.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
    const timer = setTimeout(() => {
      readContract();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, []);
  
  const readContract = async () => {
    setIsReading(true);
    
    // Start with a detailed introduction
    setCurrentSection("GİRİŞ");
    await new Promise<void>((resolve) => {
      speakText("Sayın veli, sizlere 9. sınıf kayıt sözleşmesini okuyacağım. Bu sözleşme, öğrenci, veli ve okul arasındaki karşılıklı hak ve sorumlulukları içermektedir. Lütfen sözleşmenin tamamını dikkatle dinleyiniz. Sözleşmeyi anladığınızda sayfanın alt kısmında bulunan onay butonuna tıklayarak kayıt formuna geçebilirsiniz.", {
        rate: 0.8,
        onEnd: () => resolve()
      });
    });
    
    // Wait a moment before starting the actual contract
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Group paragraphs by sections for more organized reading
    const sections = [
      { title: "SÖZLEŞME GİRİŞ", endIndex: 6 },
      { title: "SÖZLEŞME TARAFLARI", endIndex: 10 },
      { title: "OKUL HAKLARI", endIndex: 20 },
      { title: "OKUL SORUMLULUKLARI", endIndex: 42 },
      { title: "ÖĞRENCİ HAKLARI", endIndex: 62 },
      { title: "ÖĞRENCİ SORUMLULUKLARI", endIndex: 81 },
      { title: "VELİ HAKLARI", endIndex: 97 },
      { title: "VELİ SORUMLULUKLARI", endIndex: 130 }
    ];
    
    // Read contract by sections with appropriate pauses
    let currentParaIndex = 0;
    for (let section of sections) {
      setCurrentSection(section.title);
      
      // Small pause before starting new section
      await new Promise(resolve => setTimeout(resolve, 500));
      
      while (currentParaIndex <= section.endIndex && currentParaIndex < contractParagraphs.length) {
        if (contractParagraphs[currentParaIndex].trim()) {
          setCurrentSpeakingIndex(currentParaIndex);
          
          // Scroll to the current paragraph with smooth animation
          if (scrollRef.current) {
            const paragraphElement = document.getElementById(`paragraph-${currentParaIndex}`);
            if (paragraphElement) {
              scrollRef.current.scrollTo({
                top: paragraphElement.offsetTop - 100,
                behavior: 'smooth'
              });
            }
          }
          
          await new Promise<void>((resolve) => {
            speakText(contractParagraphs[currentParaIndex], {
              rate: 0.8, // Slightly slower rate for better comprehension
              pitch: 1.0,
              volume: 1.0,
              onEnd: () => {
                // Small pause after each paragraph for better comprehension
                setTimeout(resolve, 300);
              }
            });
          });
        }
        currentParaIndex++;
      }
    }
    
    // Conclusion message
    setCurrentSection("SONUÇ");
    setCurrentSpeakingIndex(-1);
    await new Promise<void>((resolve) => {
      speakText("Sözleşmenin okunması tamamlanmıştır. Sözleşmeyi kabul etmek ve kayıt formuna geçmek için lütfen sayfanın altındaki 'Sözleşmeyi Anladım' butonuna tıklayınız. Herhangi bir sorunuz varsa okul yönetimine başvurabilirsiniz.", {
        rate: 0.8,
        onEnd: () => resolve()
      });
    });
    
    setIsReading(false);
    setReadingFinished(true);
  };
  
  return (
    <Card className={`w-full mx-auto max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">9. Sınıf Kayıt Sözleşmesi</CardTitle>
        {currentSection && (
          <div className="text-center mt-1 text-white/90 font-medium">
            {currentSection}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div 
          ref={scrollRef} 
          className="max-h-[500px] overflow-y-auto p-4 mb-6 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          {contractParagraphs.map((paragraph, index) => (
            <p 
              key={index} 
              id={`paragraph-${index}`}
              className={`mb-3 transition-all duration-500 ${
                currentSpeakingIndex === index
                  ? `${isDarkMode 
                      ? 'bg-blue-900 text-white font-medium text-lg px-4 py-3 rounded-lg shadow-lg border-l-4 border-blue-400' 
                      : 'bg-blue-100 text-blue-900 font-medium text-lg px-4 py-3 rounded-lg shadow-md border-l-4 border-blue-500'
                    }`
                  : ''
              }`}
            >
              {paragraph || '\u00A0'}
            </p>
          ))}
        </div>
        
        <div className="text-center">
          <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'} font-bold mb-4`}>
            Sözleşmeyi anladıktan sonra aşağıdaki butona tıklayarak kayıt formuna geçebilirsiniz.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-6 text-lg`}
          onClick={onComplete}
          disabled={isReading && !readingFinished}
        >
          {isReading ? "Sözleşme Okunuyor..." : "Sözleşmeyi Anladım"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RegistrationContract;
