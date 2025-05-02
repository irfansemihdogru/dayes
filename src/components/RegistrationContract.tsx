
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
desteğini beklemek 
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
çocuğumun, disiplin kurallarına uyması için gerekli önlemleri alacağım. 
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
  const contractParagraphs = contractText.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
    
    // Speak warning at the beginning
    await new Promise<void>((resolve) => {
      speakText("Sayın veli, lütfen dikkatle dinleyiniz. Sözleşmeyi anladıktan sonra alttaki formu doldurup imzalamanız gerekmektedir.", {
        rate: 0.9,
        onEnd: () => resolve()
      });
    });
    
    // Read contract paragraphs one by one with highlighting
    for (let i = 0; i < contractParagraphs.length; i++) {
      if (contractParagraphs[i].trim()) {
        setCurrentSpeakingIndex(i);
        
        // Scroll to the current paragraph
        if (scrollRef.current) {
          const paragraphElement = document.getElementById(`paragraph-${i}`);
          if (paragraphElement) {
            scrollRef.current.scrollTop = paragraphElement.offsetTop - 100;
          }
        }
        
        await new Promise<void>((resolve) => {
          speakText(contractParagraphs[i], {
            rate: 0.9,
            onEnd: () => resolve()
          });
        });
      }
    }
    
    // Speak warning at the end
    setCurrentSpeakingIndex(-1);
    await new Promise<void>((resolve) => {
      speakText("Sözleşmeyi dinlediğiniz için teşekkür ederiz. Lütfen sözleşmeyi anladıktan sonra alttaki formu doldurup imzalayınız.", {
        rate: 0.9,
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
              className={`mb-3 ${
                currentSpeakingIndex === index
                  ? `${isDarkMode 
                      ? 'bg-blue-900/50 text-blue-100' 
                      : 'bg-blue-100 text-blue-900'
                    } p-2 rounded transition-all duration-300`
                  : ''
              }`}
            >
              {paragraph || '\u00A0'}
            </p>
          ))}
        </div>
        
        <div className="text-center">
          <p className={`${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'} font-bold mb-4`}>
            Sözleşmeyi anladıktan sonra aşağıdaki formu doldurup imzalayınız.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button 
          className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
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
